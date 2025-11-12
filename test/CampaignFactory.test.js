const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignFactory", function () {
  let campaignFactory, ngoRegistry, soulboundToken;
  let owner, ngo, donor, beneficiary, feeCollector;

  beforeEach(async function () {
    [owner, ngo, donor, beneficiary, feeCollector] = await ethers.getSigners();

  // Deploy NGOGovernance and NGORegistry (NGORegistry requires governance address)
  const NGOGovernance = await ethers.getContractFactory("NGOGovernance");
  const ngoGovernance = await NGOGovernance.deploy();
  await ngoGovernance.waitForDeployment();

  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  ngoRegistry = await NGORegistry.deploy(await ngoGovernance.getAddress());
  await ngoRegistry.waitForDeployment();

    // Deploy SoulboundToken
    const SoulboundToken = await ethers.getContractFactory("SoulboundToken");
    soulboundToken = await SoulboundToken.deploy();
    await soulboundToken.waitForDeployment();

    // Deploy CampaignFactory
    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    campaignFactory = await CampaignFactory.deploy(
      await ngoRegistry.getAddress(),
      await soulboundToken.getAddress(),
      feeCollector.address
    );
    await campaignFactory.waitForDeployment();

    // Grant MINTER_ROLE to CampaignFactory
    const MINTER_ROLE = await soulboundToken.MINTER_ROLE();
    await soulboundToken.grantRole(MINTER_ROLE, await campaignFactory.getAddress());

    // Register and verify NGO
    await ngoRegistry.registerNGO(
      ngo.address,
      "Test NGO",
      "REG123",
      "USA",
      "Health",
      "QmTestHash"
    );

    const VERIFIER_ROLE = await ngoRegistry.VERIFIER_ROLE();
    await ngoRegistry.grantRole(VERIFIER_ROLE, owner.address);
    await ngoRegistry.verifyNGO(1);
  });

  describe("Campaign Creation", function () {
    it("Should create campaign successfully", async function () {
      const targetAmount = ethers.parseEther("10.0");
      const duration = 30 * 24 * 60 * 60; // 30 days

      await expect(
        campaignFactory.connect(ngo).createCampaign(
          "Save Children",
          "Help save children",
          "Health",
          targetAmount,
          duration,
          "QmDocHash"
        )
      ).to.emit(campaignFactory, "CampaignCreated");

      const campaign = await campaignFactory.getCampaign(1);
      expect(campaign.title).to.equal("Save Children");
      expect(campaign.targetAmount).to.equal(targetAmount);
    });

    it("Should fail if NGO not verified", async function () {
      await expect(
        campaignFactory.connect(donor).createCampaign(
          "Test",
          "Test",
          "Test",
          ethers.parseEther("1.0"),
          1000,
          "hash"
        )
      ).to.be.revertedWith("Only verified NGOs can create campaigns");
    });
  });

  describe("Donations", function () {
    let campaignId;

    beforeEach(async function () {
      await campaignFactory.connect(ngo).createCampaign(
        "Test Campaign",
        "Description",
        "Health",
        ethers.parseEther("10.0"),
        30 * 24 * 60 * 60,
        "hash"
      );
      campaignId = 1;
    });

    it("Should accept donations", async function () {
      const donationAmount = ethers.parseEther("1.0");

      await expect(
        campaignFactory.connect(donor).donate(campaignId, { value: donationAmount })
      ).to.emit(campaignFactory, "DonationReceived");

      const campaign = await campaignFactory.getCampaign(campaignId);
      expect(campaign.raisedAmount).to.equal(donationAmount);
      expect(campaign.totalDonors).to.equal(1);
    });

    it("Should track multiple donors", async function () {
      await campaignFactory.connect(donor).donate(campaignId, { value: ethers.parseEther("1.0") });
      await campaignFactory.connect(owner).donate(campaignId, { value: ethers.parseEther("2.0") });

      const campaign = await campaignFactory.getCampaign(campaignId);
      expect(campaign.totalDonors).to.equal(2);
      expect(campaign.raisedAmount).to.equal(ethers.parseEther("3.0"));
    });

    it("Should auto-complete when target reached", async function () {
      await campaignFactory.connect(donor).donate(campaignId, { value: ethers.parseEther("10.0") });

      const campaign = await campaignFactory.getCampaign(campaignId);
      expect(campaign.status).to.equal(3); // Completed status
    });
  });

  describe("Beneficiary Tokens", function () {
    let campaignId;

    beforeEach(async function () {
      await campaignFactory.connect(ngo).createCampaign(
        "Test Campaign",
        "Description",
        "Health",
        ethers.parseEther("10.0"),
        30 * 24 * 60 * 60,
        "hash"
      );
      campaignId = 1;

      // Donate to campaign
      await campaignFactory.connect(donor).donate(campaignId, { value: ethers.parseEther("5.0") });
    });

    it("Should issue beneficiary token", async function () {
      await expect(
        campaignFactory.connect(ngo).issueBeneficiaryToken(
          campaignId,
          beneficiary.address,
          ethers.parseEther("1.0"),
          "Eye Surgery",
          30 * 24 * 60 * 60
        )
      ).to.emit(campaignFactory, "BeneficiaryTokenIssued");

      expect(await soulboundToken.balanceOf(beneficiary.address)).to.equal(1);
    });

    it("Should fail if insufficient funds", async function () {
      await expect(
        campaignFactory.connect(ngo).issueBeneficiaryToken(
          campaignId,
          beneficiary.address,
          ethers.parseEther("10.0"), // More than available
          "Service",
          1000
        )
      ).to.be.revertedWith("Insufficient campaign funds");
    });

    it("Should update beneficiary count", async function () {
      await campaignFactory.connect(ngo).issueBeneficiaryToken(
        campaignId,
        beneficiary.address,
        ethers.parseEther("1.0"),
        "Service",
        1000
      );

      const campaign = await campaignFactory.getCampaign(campaignId);
      expect(campaign.totalBeneficiaries).to.equal(1);
    });
  });

  describe("Milestones", function () {
    let campaignId;

    beforeEach(async function () {
      await campaignFactory.connect(ngo).createCampaign(
        "Test Campaign",
        "Description",
        "Health",
        ethers.parseEther("10.0"),
        30 * 24 * 60 * 60,
        "hash"
      );
      campaignId = 1;
    });

    it("Should add milestone", async function () {
      await expect(
        campaignFactory.connect(ngo).addMilestone(
          campaignId,
          "First milestone",
          ethers.parseEther("5.0"),
          Math.floor(Date.now() / 1000) + 1000
        )
      ).to.emit(campaignFactory, "MilestoneAdded");

      const milestones = await campaignFactory.getCampaignMilestones(campaignId);
      expect(milestones.length).to.equal(1);
    });

    it("Should complete milestone", async function () {
      await campaignFactory.connect(ngo).addMilestone(
        campaignId,
        "Milestone",
        ethers.parseEther("5.0"),
        Math.floor(Date.now() / 1000) + 1000
      );

      await campaignFactory.connect(ngo).completeMilestone(campaignId, 0, "QmProofHash");

      const milestones = await campaignFactory.getCampaignMilestones(campaignId);
      expect(milestones[0].status).to.equal(2); // Completed
    });
  });
});
