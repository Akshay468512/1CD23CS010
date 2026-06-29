
const loggingMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
};

module.exports = loggingMiddleware;