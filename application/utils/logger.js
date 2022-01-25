const path = require('path');
const winston = require('winston');

function createLogFormat(label) {
    return winston.format.combine(
        winston.format.label({
            label: label,
        }),
        winston.format.timestamp({
            format: 'MMM-DD-YYYY HH:MM:SS'
        }),
        winston.format.align(),
        winston.format.printf(info =>
            `${info.label}  ${info.level.toUpperCase()}:\t ${info.timestamp} ${info.message}`
        )
    );
}


module.exports = {
    info: winston.createLogger({
        format: createLogFormat('ℹ️'),
        level: 'info',
        transports: new winston.transports.File({
            filename: path.resolve(process.cwd(), 'logs', 'info.log'),
            maxsize: 2000000
        })
    }),
    error: winston.createLogger({
        format: createLogFormat('❌'),
        level: 'error',
        transports: new winston.transports.File({
            filename: path.resolve(process.cwd(), 'logs', 'error.log'),
            maxsize: 15000
        })
    }),
    warn: winston.createLogger({
        format: createLogFormat('⚠️'),
        level: 'warn',
        transports: new winston.transports.File({
            filename: path.resolve(process.cwd(), 'logs', 'warning.log'),
            maxsize: 15000
        })
    }),
    debug: winston.createLogger({
        format: createLogFormat('✔️'),
        level: 'debug',
        transports: new winston.transports.File({
            filename: path.resolve(process.cwd(), 'logs', 'debug.log'),
            maxsize: 15000000
        })
    })
};
