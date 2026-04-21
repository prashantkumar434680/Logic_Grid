const Problem = require('../Models/Problem');

const DAY_IN_MS = 24 * 60 * 60 * 1000;
let schedulerInterval = null;
let schedulerTimeout = null;
let isRotating = false;

const getUTCStartOfDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const isSameUTCDate = (first, second) => {
  if (!first || !second) return false;

  const a = new Date(first);
  const b = new Date(second);

  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
};

const rotateDailyProblem = async (targetDate = new Date()) => {
  if (isRotating) {
    return null;
  }

  isRotating = true;

  try {
    const activeDate = getUTCStartOfDay(targetDate);

    const existingDailyProblem = await Problem.findOne({ isDailyProblem: true });

    if (existingDailyProblem?.activeDate && isSameUTCDate(existingDailyProblem.activeDate, activeDate)) {
      return existingDailyProblem;
    }

    const matchStage = existingDailyProblem
      ? { _id: { $ne: existingDailyProblem._id } }
      : {};

    const [sampledProblem] = await Problem.aggregate([
      { $match: matchStage },
      { $sample: { size: 1 } },
    ]);

    if (!sampledProblem && !existingDailyProblem) {
      return null;
    }

    const selectedProblemId = sampledProblem?._id || existingDailyProblem._id;

    await Problem.updateMany(
      { isDailyProblem: true },
      { $set: { isDailyProblem: false } }
    );

    return Problem.findByIdAndUpdate(
      selectedProblemId,
      {
        $set: {
          isDailyProblem: true,
          activeDate,
        },
      },
      { new: true }
    );
  } finally {
    isRotating = false;
  }
};

const getCurrentDailyProblem = async () => {
  const todayStart = getUTCStartOfDay();
  const existingDailyProblem = await Problem.findOne({ isDailyProblem: true });

  if (existingDailyProblem?.activeDate && isSameUTCDate(existingDailyProblem.activeDate, todayStart)) {
    return existingDailyProblem;
  }

  return rotateDailyProblem(todayStart);
};

const startDailyProblemScheduler = async () => {
  await getCurrentDailyProblem();

  const now = new Date();
  const nextUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );

  const delayToNextRun = Math.max(nextUtcMidnight.getTime() - now.getTime(), 0);

  schedulerTimeout = setTimeout(async () => {
    await rotateDailyProblem(new Date());

    schedulerInterval = setInterval(async () => {
      await rotateDailyProblem(new Date());
    }, DAY_IN_MS);
  }, delayToNextRun);
};

const stopDailyProblemScheduler = () => {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

module.exports = {
  DAY_IN_MS,
  getUTCStartOfDay,
  isSameUTCDate,
  rotateDailyProblem,
  getCurrentDailyProblem,
  startDailyProblemScheduler,
  stopDailyProblemScheduler,
};
