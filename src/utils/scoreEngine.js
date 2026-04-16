export const calculateJapaScore = ({
  savingsProgress,
  fxSignal,
  politicalRisk,
  cryptoSentiment,
}) => {
  const savingsScore = savingsProgress * 40;
  const fxScore = fxSignal * 20;
  const politicalScore = (1 - politicalRisk) * 20;
  const cryptoScore = cryptoSentiment * 20;

  const total = Math.round(
    savingsScore + fxScore + politicalScore + cryptoScore,
  );

  return Math.min(100, Math.max(0, total));
};

export const getScoreStatus = (score) => {
  if (score >= 80)
    return { label: "Ready to Japa", color: "#3B6D11", bg: "#EAF3DE" };
  if (score >= 60)
    return { label: "Almost Ready", color: "#3B6D11", bg: "#EAF3DE" };
  if (score >= 40)
    return { label: "Keep Saving", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Not Yet", color: "#A32D2D", bg: "#FCEBEB" };
};
