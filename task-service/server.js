
const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")
const express = require("express")
const mongoose = require("mongoose")
const { sendNotification } = require("./notificationClient") ;
const path = require("path");


const PROTO_PATH=path.join(__dirname,"proto","task.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const taskProto = grpc.loadPackageDefinition(packageDefinition).task;

const app = express();
app.use( express.json() );

//connect to mongodb
mongoose
    .connect(
        "mongodb+srv://digicartecom:LZiAE4ixHdfIQisY@ecom-auth-service.2ofms.mongodb.net/?retryWrites=true&w=majority&appName=ecom-auth-service"
    )
    .then(()=> {
        console.log("task sevice db is connected")
    })
    .catch((err) => {
        console.log("task db is not connected" , err)
    })


//task model
const Task = mongoose.model("Task", {

    tittle: String,
    description: String,
    user_id: String
});


const createTask = async(call,callback) => {
    const {user_id,tittle,description} = call.request;

    const newTask = new Task({ tittle, description, user_id});
    await newTask.save()
        .then(task => {
            sendNotification(user_id,`New task created: ${tittle}`);
            callback(null, { message: "Task created Successfully", task_id: task._id});
        })
        .catch(err => callback(err) )
}


const getTask = (call, callback) => {
    Task.findById(call.request.task_id, (err, task) => {
        if(err) return callback(err);
        callback(null, {task_id:task._id , tittle: task.tittle, description:task.description });

    });
};

const listTasks = (call, callback) => {
    Task.find({},(err,tasks) => {
        if(err) return callback(err)
        const taskList = tasks.map(task => ({
            
            task_id: task._id.toString(),
            tittle:task.tittle,
            description:task.description
    
        }));
        callback(null, { tasks:taskList });
    });
};


//grpc server setup
const server = new grpc.Server();
server.addService(taskProto.TaskService.service, 
    {    createTask: createTask ,
         GetTask: getTask, 
         listTasks: listTasks });

const grpcPort = 3334;
server.bindAsync(
    `127.0.0.1:${grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, bindPort) => {
      if (err) {
        console.error("Error binding server:", err);
        return;
      }
      console.log(`Task Service running at http://127.0.0.1:${bindPort}`);
    }
  );


 // Express REST endpoint for testing gRPC
 app.post("/task", (req,res) => {

    const { user_id, tittle, description} = req.body
 
    //grpc client setup 
    const gRPCClient = new taskProto.TaskService(
        `localhost:${grpcPort}`,
        grpc.credentials.createInsecure()
    );

    //call grpc createtask method
    const requestData = {user_id,tittle,description};
    gRPCClient.createTask( requestData ,(err,response) => {
        if(err){
            console.error("Error in creating task", err);
            return res.status(500).json({error:err})
        }
        res.status(200).json(response)
    })
 })



//express for test
app.listen(3335, () => {
    console.log(`Task service express is running on port 3335`)
});




