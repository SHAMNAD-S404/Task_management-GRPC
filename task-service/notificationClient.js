const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader");
const path = require("path")

const PROTO_PATH = path.join(__dirname, "..", "notification-service", "proto", "notification.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH)
const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

const client = new notificationProto.NotificationService("localhost:3333",grpc.credentials.createInsecure() );


const sendNotification = ( user_id , message ) => {
    client.SendNotification( {user_id , message } , (error, response) => {
        if (error) {
            console.error("Error while sending notification" , error);
        } else {
            console.log("Notification send successfully", response.status);
        }
    })
}

module.exports = { sendNotification };