import Visitor from "../models/Visitor.js";

export const trackVisitor = async (req, res, next) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";
    const userId = req.user?.userId || null;

    // avoid duplicate counts per day
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const alreadyVisited = await Visitor.findOne({
      ip,
      userAgent,
      visitedAt: { $gte: start, $lte: end },
    });

    if (!alreadyVisited) {
      await Visitor.create({ ip, userAgent, userId });
    }

    next();
  } catch (err) {
    console.error("Visitor tracking error:", err.message);
    next();
  }
};
