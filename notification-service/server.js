
const grpc = require("@grpc/grpc-js")
const protoLoader = require('@grpc/proto-loader');
const path = require('path')

const PROTO_PATH=path.join(__dirname,"proto","notification.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const notificationProto = grpc.loadPackageDefinition( packageDefinition ).notification;

//notification
const sendNotification = (call, callback) => {

    const {user_id , message } = call.request;
    console.log(`Sending notification to user ${user_id}: ${message}`);
    callback(null, { status:"Notification sent" });
    
};

const server = new grpc.Server();
server.addService(notificationProto.NotificationService.service ,
    { SendNotification: sendNotification });

//port mention
const port = 3333;

//server creation
server.bindAsync(
    `127.0.0.1:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, bindPort) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Notification Service running at http://127.0.0.1:${bindPort}`);
     
    }
  );

 