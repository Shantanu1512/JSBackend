 import mongoose from "mongoose";
 import jwt from "jsonwebtoken";
 import { asyncHandler } from "../utils/asyncHandler";

 const toggleSubscription = asyncHandler( async(req, res) => {
    const { channelId } = req.params
 })

 const getUserChannelSubscribers = asyncHandler( async(req, res) =>{
    const { channelId } = req.params
 })

 const getSubscribedChannels = asyncHandler( async(req, res) =>{

 })

 export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
 }