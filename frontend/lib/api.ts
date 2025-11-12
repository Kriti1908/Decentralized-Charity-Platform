// API Client for Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(address: string, signature: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ address, signature }),
    });
  }

  // NGOs
  async registerNGO(data: any) {
    return this.request('/ngos/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNGO(address: string) {
    return this.request(`/ngos/${address}`, { method: 'GET' });
  }

  async getAllNGOs() {
    return this.request('/ngos/all', { method: 'GET' });
  }

  // Campaigns
  // Campaigns
  async createCampaign(data: any) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaign(id: string) {
    return this.request(`/campaigns/${id}`, { method: 'GET' });
  }

  async getAllCampaigns(params?: { status?: string; category?: string; ngoAddress?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.ngoAddress) queryParams.append('ngoAddress', params.ngoAddress);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/campaigns${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async updateCampaign(id: string, data: any) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addCampaignUpdate(id: string, data: { title: string; content: string }) {
    return this.request(`/campaigns/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncCampaign(id: string) {
    return this.request(`/campaigns/${id}/sync`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Donations
  async getDonations(params?: { 
    campaignId?: string; 
    donorAddress?: string; 
    page?: number; 
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.campaignId) queryParams.append('campaignId', params.campaignId);
    if (params?.donorAddress) queryParams.append('donorAddress', params.donorAddress);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/donations${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async getDonation(id: string) {
    return this.request(`/donations/${id}`, { method: 'GET' });
  }

  async recordDonation(data: {
    donationId: string;
    campaignId: string;
    donorAddress: string;
    amount: string;
    transactionHash: string;
    blockNumber: number;
    isAnonymous?: boolean;
    message?: string;
  }) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaignDonations(campaignId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/donations/campaign/${campaignId}${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async getDonorHistory(donorAddress: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/donations/donor/${donorAddress}${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async getDonationStats(campaignId: string) {
    return this.request(`/donations/stats/${campaignId}`, { method: 'GET' });
  }

  async syncDonation(id: string) {
    return this.request(`/donations/${id}/sync`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
  
  // Service Providers
  async registerServiceProvider(data: {
    providerId?: number;
    address: string;
    name: string;
    registrationNumber: string;
    serviceType: string;
    location: string;
    contactInfo?: string;
    verificationDocHash: string;
    transactionHash: string;
  }) {
    return this.request('/providers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServiceProvider(address: string) {
    return this.request(`/providers/${address}`, { method: 'GET' });
  }

  async getServiceProviderById(id: string) {
    return this.request(`/providers/id/${id}`, { method: 'GET' });
  }

  async getServiceProviders(params?: { 
    status?: string; 
    serviceType?: string; 
    page?: number; 
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.serviceType) queryParams.append('serviceType', params.serviceType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/providers${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async updateServiceProvider(address: string, data: any) {
    return this.request(`/providers/${address}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async syncServiceProvider(address: string) {
    return this.request(`/providers/${address}/sync`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async recordServiceProviderRedemption(address: string, amount: number) {
    return this.request(`/providers/${address}/record-redemption`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Add this method to the ApiClient class
  async getServiceProviderTokens(providerAddress: string) {
    return this.request(`/providers/${providerAddress}/tokens`, { method: 'GET' });
  }
  
  // Beneficiaries
  async getBeneficiaryTokens(beneficiaryAddress: string) {
    return this.request(`/beneficiaries/${beneficiaryAddress}/tokens`, { method: 'GET' });
  }

  async getBeneficiaryStats(beneficiaryAddress: string) {
    return this.request(`/beneficiaries/${beneficiaryAddress}/stats`, { method: 'GET' });
  }

  async getBeneficiaryToken(beneficiaryAddress: string, tokenId: string) {
    return this.request(`/beneficiaries/${beneficiaryAddress}/tokens/${tokenId}`, { method: 'GET' });
  }
}

export const api = new ApiClient(API_BASE_URL);
