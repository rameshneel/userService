import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { env } from "../../config/env.js"; // Environment variables

const PROTO_PATH = path.join(__dirname, "../../proto/user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const userPackage = grpcObject.userPackage;

const client = new userPackage.UserService(
  `${env.GRPC_USER_SERVICE_HOST}:${env.GRPC_USER_SERVICE_PORT}`,
  grpc.credentials.createInsecure()
);

// gRPC call to get user profile by ID
export function getUserProfile(userId) {
  return new Promise((resolve, reject) => {
    client.GetUserById({ userId }, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

// import { loadSync } from "@grpc/proto-loader";
// import { credentials as grpcCredentials } from "@grpc/grpc-js";
// import grpc from "@grpc/grpc-js";
// import path from "path";
// import { fileURLToPath } from "url";
// import grpcConfig from "../../config/grpc.js";
// import logger from "../../config/logger.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const protoPath = path.join(__dirname, "../proto/user.proto");
// const packageDefinition = loadSync(
//   protoPath,
//   grpcConfig.protoFiles.loaderOptions
// );
// const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// export class UserClient {
//   constructor() {
//     const { host, port, secure, credentials } = grpcConfig.clients.userService;
//     const grpcCredentialsObj =
//       secure && credentials.rootCerts
//         ? grpcCredentials.createSsl(
//             Buffer.from(credentials.rootCerts),
//             Buffer.from(credentials.privateKey),
//             Buffer.from(credentials.certChain)
//           )
//         : grpcCredentials.createInsecure();

//     this.client = new userProto.UserService(
//       `${host}:${port}`,
//       grpcCredentialsObj,
//       grpcConfig.clients.userService.options
//     );
//   }

//   async getUserProfile(email) {
//     return new Promise((resolve, reject) => {
//       const deadline = new Date(
//         Date.now() + grpcConfig.clients.userService.deadline
//       );
//       this.client.GetUserProfile({ email }, { deadline }, (error, response) => {
//         if (error) {
//           logger.error("gRPC GetUserProfile error:", error);
//           return reject(error);
//         }
//         if (response.error) {
//           return reject(new Error(response.error.message));
//         }
//         resolve(response);
//       });
//     });
//   }
// }

// export const userClient = new UserClient();
