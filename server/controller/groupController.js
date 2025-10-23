import Group from "../models/group.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members = [] } = req.body;
    const ownerId = req.user._id;
    if (!name) return res.json({ success: false, message: "Group name required" });
    const allMembers = Array.from(new Set([ownerId.toString(), ...members]));
    const group = await Group.create({ name, ownerId, members: allMembers });
    res.json({ success: true, group });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};


