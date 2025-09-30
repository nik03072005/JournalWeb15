// import userModel from "@/models/userModel";
// import { NextResponse } from "next/server";

// // Get subscription details for a user
// export async function getSubscription(req) {
//     try {
//         const user = await userModel.findOne({ role: "admin" });
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }
//         return NextResponse.json({ subscription: user.subscription }, { status: 200 });
//     } catch (error) {
//         return NextResponse.json({ message: 'Server error', error }, { status: 500 });
//     }
// }

// export async function autoUpdateSubscription() {
//     try {
//         const user = await userModel.findOne({ role: "admin" });
//         console.log('Auto updating subscription for user:', user?._id);
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }

//         const endDate = user.subscription.endDate;
//         const currentDate = new Date();
//         console.log('Current Date:', currentDate, 'End Date:', endDate);

//         if (endDate < currentDate) {
//             user.subscription.status = "inactive";
//             console.log('Subscription inactive, updating status for user:', user.subscription.status);
//             await user.save();
//         }

//         return NextResponse.json({ message: 'Subscriptions updated successfully' }, { status: 200 });
//     } catch (error) {
//         console.log('Error updating subscription:', error);
//         return NextResponse.json({ message: 'Server error', error }, { status: 500 });
//     }
// }

// // Update subscription details for a user
// export async function updateSubscription(req) {
//     try {
//         const { id } = req.params;
//         const body = await req.json();
//         const { status, startDate, endDate } = body;

//         const user = await userModel.findById(id);
//         if (!user) {
//             return NextResponse.json({ message: 'User not found' }, { status: 404 });
//         }

//         user.subscription.status = status || user.subscription.status;
//         user.subscription.startDate = startDate || user.subscription.startDate;
//         user.subscription.endDate = endDate || user.subscription.endDate;

//         await user.save();
//         return NextResponse.json({ message: 'Subscription updated successfully', subscription: user.subscription }, { status: 200 });
//     } catch (error) {
//         return NextResponse.json({ message: 'Server error', error }, { status: 500 });
//     }
// }

// //get admin 
// export async function getAdmin(req,res){
//     try {
//         const admin = await userModel.find({ role: 'admin' });
//         return NextResponse.json({ admin }, { status: 200 });
//     } catch (error) {
//         return NextResponse.json({ message: 'Server error', error }, { status: 500 });
//     }
// }
