export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint): string {
  const ether = Number(wei) / 1e18;
  return ether.toFixed(4);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(timestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  return Math.floor(diff / (24 * 60 * 60));
}

export function getCampaignStatus(status: number): string {
  const statuses = ['Active', 'Completed', 'Cancelled', 'Expired'];
  return statuses[status] || 'Unknown';
}

export function getNGOStatus(status: number): string {
  const statuses = ['Pending', 'Verified', 'Rejected', 'Suspended', 'Blacklisted'];
  return statuses[status] || 'Unknown';
}

export function getTokenStatus(status: number): string {
  const statuses = ['Active', 'Redeemed', 'Expired', 'Revoked'];
  return statuses[status] || 'Unknown';
}

export function calculateProgress(raised: bigint, target: bigint): number {
  if (target === BigInt(0)) return 0;
  return Math.min(100, Math.floor((Number(raised) / Number(target)) * 100));
}
