import { Server, ServerCredentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import grpcConfig from "../../config/grpc.js";
import logger from "../../config/logger.js";
import { getUserAuthInfo, validateToken } from "../services/auth.service.js";
import grpc from "@grpc/grpc-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const protoPath = path.join(grpcConfig.protoFiles.path, "auth.proto");
const packageDefinition = loadSync(
  protoPath,
  grpcConfig.protoFiles.loaderOptions
);
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

function loggingInterceptor(call, callback, next) {
  const method = call.method_definition.path;
  grpcConfig.server.middleware.logging.logRequest(method, call.request);
  const originalCallback = callback;
  callback = (error, response) => {
    if (error) {
      grpcConfig.server.middleware.logging.logError(method, error);
    } else {
      grpcConfig.server.middleware.logging.logResponse(method, response);
    }
    originalCallback(error, response);
  };
  next(call, callback);
}

export function startGrpcServer() {
  const server = new Server();
  server.addService(authProto.AuthService.service, {
    GetUserAuthInfo: loggingInterceptor.bind(null, getUserAuthInfo),
    ValidateToken: loggingInterceptor.bind(null, validateToken),
  });

  const credentials =
    grpcConfig.server.secure && grpcConfig.server.credentials.rootCerts
      ? ServerCredentials.createSsl(
          Buffer.from(grpcConfig.server.credentials.rootCerts),
          [
            {
              private_key: Buffer.from(
                grpcConfig.server.credentials.privateKey
              ),
              cert_chain: Buffer.from(grpcConfig.server.credentials.certChain),
            },
          ]
        )
      : ServerCredentials.createInsecure();

  server.bindAsync(
    `${grpcConfig.server.host}:${grpcConfig.server.port}`,
    credentials,
    () => {
      server.start();
      logger.info(
        `gRPC server running on ${grpcConfig.server.host}:${grpcConfig.server.port}`
      );
    }
  );
}
