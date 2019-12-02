const { createLogger, transports, format } = require("winston");
const morgan = require("morgan");

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.File({
      filename: "./logs/express.log",
      json: false,
      maxsize: 5242880,
      maxFiles: 5
    }),
    new transports.Console()
  ]
});

logger.stream = {
  write: message => logger.info(message.substring(0, message.lastIndexOf("\n")))
};

module.exports = morgan(
  ":method :url :status :response-time ms - :res[content-length]",
  { stream: logger.stream }
);
