const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SoulboundToken", function () {
  let soulboundToken;
  let owner, minter, redeemer, beneficiary, otherAccount;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const REDEEMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REDEEMER_ROLE"));

  beforeEach(async function () {
    [owner, minter, redeemer, beneficiary, otherAccount] = await ethers.getSigners();

    const SoulboundToken = await ethers.getContractFactory("SoulboundToken");
    soulboundToken = await SoulboundToken.deploy();
    await soulboundToken.waitForDeployment();

    // Grant roles
    await soulboundToken.grantRole(MINTER_ROLE, minter.address);
    await soulboundToken.grantRole(REDEEMER_ROLE, redeemer.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await soulboundToken.name()).to.equal("CharityEntitlementToken");
      expect(await soulboundToken.symbol()).to.equal("CET");
    });

    it("Should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await soulboundToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint token successfully", async function () {
      const campaignId = 1;
      const entitledAmount = ethers.parseEther("1.0");
      const serviceType = "Eye Surgery";
      const validityPeriod = 30 * 24 * 60 * 60; // 30 days

      await expect(
        soulboundToken.connect(minter).mintToken(
          beneficiary.address,
          campaignId,
          entitledAmount,
          serviceType,
          validityPeriod
        )
      ).to.emit(soulboundToken, "TokenMinted");

      expect(await soulboundToken.balanceOf(beneficiary.address)).to.equal(1);
    });

    it("Should fail if not minter", async function () {
      await expect(
        soulboundToken.connect(otherAccount).mintToken(
          beneficiary.address,
          1,
          ethers.parseEther("1.0"),
          "Service",
          1000
        )
      ).to.be.reverted;
    });

    it("Should store correct metadata", async function () {
      const campaignId = 1;
      const entitledAmount = ethers.parseEther("1.0");
      const serviceType = "Eye Surgery";
      const validityPeriod = 30 * 24 * 60 * 60;

      await soulboundToken.connect(minter).mintToken(
        beneficiary.address,
        campaignId,
        entitledAmount,
        serviceType,
        validityPeriod
      );

      const metadata = await soulboundToken.getTokenMetadata(0);
      expect(metadata.beneficiary).to.equal(beneficiary.address);
      expect(metadata.campaignId).to.equal(campaignId);
      expect(metadata.entitledAmount).to.equal(entitledAmount);
      expect(metadata.serviceType).to.equal(serviceType);
    });
  });

  describe("Redemption", function () {
    let tokenId;

    beforeEach(async function () {
      await soulboundToken.connect(minter).mintToken(
        beneficiary.address,
        1,
        ethers.parseEther("1.0"),
        "Eye Surgery",
        30 * 24 * 60 * 60
      );
      tokenId = 0;
    });

    it("Should redeem token successfully", async function () {
      const proofHash = "QmTestHash123";

      await expect(
        soulboundToken.connect(redeemer).redeemToken(tokenId, proofHash)
      ).to.emit(soulboundToken, "TokenRedeemed");

      const metadata = await soulboundToken.getTokenMetadata(tokenId);
      expect(metadata.isRedeemed).to.be.true;
      expect(metadata.redeemedBy).to.equal(redeemer.address);
    });

    it("Should fail if already redeemed", async function () {
      await soulboundToken.connect(redeemer).redeemToken(tokenId, "QmTestHash");

      await expect(
        soulboundToken.connect(redeemer).redeemToken(tokenId, "QmTestHash2")
      ).to.be.revertedWith("Token is not active");
    });

    it("Should fail if expired", async function () {
      await time.increase(31 * 24 * 60 * 60); // Advance time by 31 days

      await expect(
        soulboundToken.connect(redeemer).redeemToken(tokenId, "QmTestHash")
      ).to.be.revertedWith("Token has expired");
    });
  });

  describe("Soulbound Properties", function () {
    let tokenId;

    beforeEach(async function () {
      await soulboundToken.connect(minter).mintToken(
        beneficiary.address,
        1,
        ethers.parseEther("1.0"),
        "Service",
        1000
      );
      tokenId = 0;
    });

    it("Should not allow transfer", async function () {
      await expect(
        soulboundToken.connect(beneficiary).transferFrom(
          beneficiary.address,
          otherAccount.address,
          tokenId
        )
      ).to.be.revertedWith("Soulbound tokens cannot be transferred");
    });

    it("Should not allow safe transfer", async function () {
      await expect(
        soulboundToken.connect(beneficiary)["safeTransferFrom(address,address,uint256)"](
          beneficiary.address,
          otherAccount.address,
          tokenId
        )
      ).to.be.revertedWith("Soulbound tokens cannot be transferred");
    });

    it("Should not allow approval", async function () {
      await expect(
        soulboundToken.connect(beneficiary).approve(otherAccount.address, tokenId)
      ).to.be.revertedWith("Soulbound tokens cannot be approved");
    });
  });

  describe("Token Queries", function () {
    beforeEach(async function () {
      await soulboundToken.connect(minter).mintToken(beneficiary.address, 1, ethers.parseEther("1.0"), "Service1", 1000);
      await soulboundToken.connect(minter).mintToken(beneficiary.address, 1, ethers.parseEther("0.5"), "Service2", 1000);
      await soulboundToken.connect(minter).mintToken(beneficiary.address, 2, ethers.parseEther("2.0"), "Service3", 1000);
    });

    it("Should return beneficiary tokens", async function () {
      const tokens = await soulboundToken.getBeneficiaryTokens(beneficiary.address);
      expect(tokens.length).to.equal(3);
    });

    it("Should return campaign tokens", async function () {
      const campaignTokens = await soulboundToken.getCampaignTokens(1);
      expect(campaignTokens.length).to.equal(2);
    });

    it("Should check if token is redeemable", async function () {
      expect(await soulboundToken.isTokenRedeemable(0)).to.be.true;
    });
  });
});
