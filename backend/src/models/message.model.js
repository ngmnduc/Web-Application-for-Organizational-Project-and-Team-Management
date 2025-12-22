import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true,
    index: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  content: { 
    type: String, 
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'SYSTEM'],
    default: 'TEXT'
  }

}, { timestamps: true }); 

const Message = mongoose.model("Message", messageSchema);
export default Message;