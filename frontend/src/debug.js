// Debug file for checking data format
const payload = {
  participant_ids: ["user_id_1", "user_id_2"],
  is_group_chat: false,
  name: "",
  initial_message: "Hello! Let's chat.",
};

console.log(JSON.stringify(payload, null, 2));
