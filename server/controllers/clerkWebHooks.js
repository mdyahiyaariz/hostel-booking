import User from "../models/User.js";
import { Webhook } from "svix";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

const clerkWebhooks = async (req, res) => {
    try {
        // Create Svix instance
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // Getting headers
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        // Verify webhook
        await whook.verify(JSON.stringify(req.body), headers);

        // Get data
        const { data, type } = req.body;

        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            image: data.image_url || "",
        };

        // Handle events
        switch (type) {

            case "user.created": {
                await User.create(userData);
                break;
            }

            case "user.updated": {
                await User.findByIdAndUpdate(
                    data.id,
                    userData,
                    { new: true }
                );
                break;
            }

            case "user.deleted": {
                const hotels = await Hotel.find({ owner: data.id }).select("_id");
                const hotelIds = hotels.map(hotel => hotel._id.toString());

                if (hotelIds.length > 0) {
                    await Room.deleteMany({ hotel: { $in: hotelIds } });
                }

                await Hotel.deleteMany({ owner: data.id });
                await User.findByIdAndDelete(data.id);
                break;
            }

            default:
                console.log(`Unhandled Clerk event: ${type}`);
                break;
        }

        res.status(200).json({
            success: true,
            message: "Webhook Received"
        });

    } catch (error) {
        console.error("Clerk Webhook Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default clerkWebhooks;