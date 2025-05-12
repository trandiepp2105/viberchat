const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  console.log("Setting up proxy middleware...");

  // Proxy WebSocket requests to the Daphne server
  const wsProxy = createProxyMiddleware({
    target: "http://localhost:8001",
    ws: true,
    changeOrigin: true,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying WebSocket request to: ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("WebSocket proxy error:", err);
      // If response is available, send an error
      if (res && res.writeHead && res.end) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`WebSocket proxy error: ${err.message}`);
      }
    },
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
      console.log(`WebSocket connection established via proxy: ${req.url}`);
    },
    onOpen: (proxySocket) => {
      console.log("WebSocket connection opened successfully");
    },
    onClose: (res, socket, head) => {
      console.log("WebSocket connection closed");
    },
  });

  // Apply the WebSocket proxy
  app.use("/ws", wsProxy);

  // Proxy API requests to the Django backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: {
        "^/api": "/api/v1",
      },
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying API request to: ${req.method} ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error("API proxy error:", err);
        if (res && res.writeHead && res.end) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`API proxy error: ${err.message}`);
        }
      },
    })
  );
};
