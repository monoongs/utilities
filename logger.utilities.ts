import { createLogger, format, transports } from "winston";

// * Level "info" for look overview
// * Level "debug" for debuging ( see only what function it calls )
// * Level "silly" for see functions name and others etc.

const logger = createLogger({
  // level: "info",
  // level: "debug",
  level: "silly",
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [new transports.Console()],
});

export default logger;
