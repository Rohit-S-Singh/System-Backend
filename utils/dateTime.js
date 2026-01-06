export const buildDateTime = (date, time) => {
  const d = new Date(date);
  const [h, m] = time.split(":");
  d.setHours(h);
  d.setMinutes(m);
  d.setSeconds(0);
  return d.toISOString();
};
