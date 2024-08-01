 import mongoose from "mongoose";
 import jwt from "jsonwebtoken";
 import { asyncHandler } from "../utils/asyncHandler.js";
 import { Subscription } from "../models/subscription.models.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

 const toggleSubscription = asyncHandler( async(req, res) => {
    const { channelId } = req.params

    /*
      get user id who's logged in
      check if channel id is correct or else throw error
      check if user subscribed to channel and toggle status
    */

      const user = req.user._id
      console.log(channelId);

      const channel = await User.findById(channelId)
      // console.log(channel);

      if(!channel){
         throw new ApiError(400, "Invalid channel name.. please input valid one")
      }

     const isSubscribed = await Subscription.findOne(
      {
         channel: channel._id,
         subscriber: req.user._id
      }
     )

     console.log(isSubscribed);
     let response;
     if(!isSubscribed){
      await Subscription.create(
         {channel: channelId, subscriber: req.user._id }
      )
      response = "Subscribed to channel"
     }
     else{
      await Subscription.deleteOne({channel: channelId, subscriber: req.user._id })
      response = "Un-subscribed from channel"
     }

      return res
         .status(200)
         .json(
            new ApiResponse(200, response, "Status toggled successfully")
         )
 })

 const getUserChannelSubscribers = asyncHandler( async(req, res) =>{
    const { channelId } = req.params

   //  console.log(channelId);
   const subscriberslData = await Subscription.aggregate(
      [
         {
            $match: {
               channel: new mongoose.Types.ObjectId(channelId)
            }
         },
         {
            $lookup: {
               from: "users",
               localField: "subscriber",
               foreignField: "_id",
               as: "subscribers",
               pipeline: [
                  {
                     $project: {
                        fullName: 1,
                        userName: 1,
                        email: 1
                     }
                  }
               ]
            }
         },
         {
            $project: {
               channel: 1,
               subscribers: 1
            }
         }
      ]
    )

    console.log(subscriberslData);
    return res
      .status(200)
      .json(
         new ApiResponse(200, subscriberslData, "Subscribers")
      )
 })

 const getSubscribedChannels = asyncHandler( async(req, res) =>{
   const { subscriberId } = req.params
   /*
      check if suberscriber document is present
      if yes then add pipeline
   */
//   console.log("Inside");
   console.log(subscriberId);
   const subscriberPresent = await Subscription.findOne({subscriber: subscriberId})

   if(!subscriberPresent){
      throw new ApiError(400, "User not subscribed to channels..")
   }

   const subscriberdChannels = await Subscription.aggregate(
      [
         {
            $match: {
               subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
         },
         {
            $lookup: {
               from: "users",
               localField: "channel",
               foreignField: "_id",
               as: "subscribedChannels",
               pipeline: [
                  {
                     $project: {
                        userName: 1
                     }
                  }
               ]
            }
         },
         {
            $project: {
               subscriber: 1,
               subscribedChannels: 1
            }
         }
      ]
   )
   console.log(subscriberdChannels);

   return res
      .status(200)
      .json(
         new ApiResponse(200, subscriberdChannels, "Subscribed channels")
      )
 })

 export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
 }