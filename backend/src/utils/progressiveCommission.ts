// Utility for calculating progressive commission based on task number

export const calculateProgressiveCommission = (
  taskNumber: number, // 1 to 20
  vipLevel: number,
  balance: number
): number => {
  const progress = (taskNumber - 1) / 19; // 0.0 to 1.0
  
  let startComm = 0;
  let endComm = 0;

  if (vipLevel === 1) {
    startComm = 6;
    endComm = 23;
  } else if (vipLevel === 2) {
    startComm = 20;
    endComm = 40;
  } else if (vipLevel === 3) {
    startComm = 400;
    endComm = 888;
  }

  const baseCommission = startComm + (endComm - startComm) * progress;
  
  // Apply a ±5% random variance for realism
  const variance = 0.95 + Math.random() * 0.1; 
  
  const finalCommission = baseCommission * variance;
  
  return Number(finalCommission.toFixed(2));
};
