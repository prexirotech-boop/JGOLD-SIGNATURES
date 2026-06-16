<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
    exit;
}

// Read raw JSON input if sent as JSON, or fallback to $_POST
$inputData = json_decode(file_get_contents("php://input"), true);
if (!$inputData) {
    $inputData = $_POST;
}

// 1. Honeypot check for bots (hidden field that humans won't fill)
if (!empty($inputData["website_verify"])) {
    // Fail silently or send mock success to fool the bot
    echo json_encode(["success" => true, "message" => "Message processed successfully (honeypot)"]);
    exit;
}

// 2. Validate required fields
$name = isset($inputData["name"]) ? strip_tags(trim($inputData["name"])) : "";
$email = isset($inputData["email"]) ? filter_var(trim($inputData["email"]), FILTER_VALIDATE_EMAIL) : "";
$subject = isset($inputData["subject"]) ? strip_tags(trim($inputData["subject"])) : "";
$message = isset($inputData["message"]) ? strip_tags(trim($inputData["message"])) : "";

if (empty($name) || !$email || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Please complete all fields with a valid email address."]);
    exit;
}

// 3. Prevent header injection attacks
$name = str_replace(array("\r", "\n"), array(" ", " "), $name);
$subject = str_replace(array("\r", "\n"), array(" ", " "), $subject);
$email = str_replace(array("\r", "\n"), array(" ", " "), $email);

// 4. Construct the email
$to = "nprecious.business1@gmail.com";
$email_subject = "Amplified Skills Contact: " . $subject;

$email_body = "
<html>
<head>
  <title>New Contact Inquiry - Amplified Skills</title>
</head>
<body style='font-family: sans-serif; line-height: 1.6; color: #334155; padding: 20px;'>
  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
    <h2 style='color: #2563eb; margin-top: 0; border-bottom: 2px solid #eff6ff; padding-bottom: 12px;'>New Contact Form Submission</h2>
    <p><strong>Name:</strong> {$name}</p>
    <p><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
    <p><strong>Subject:</strong> {$subject}</p>
    <div style='margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb;'>
      <p style='margin: 0; white-space: pre-wrap;'>{$message}</p>
    </div>
    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;' />
    <p style='font-size: 11px; color: #94a3b8; text-align: center; margin: 0;'>Sent from Amplified Skills Portal</p>
  </div>
</body>
</html>
";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Amplified Skills Support <noreply@amplifiedskills.com>" . "\r\n";
$headers .= "Reply-To: {$name} <{$email}>" . "\r\n";

// 5. Send Email
if (mail($to, $email_subject, $email_body, $headers)) {
    echo json_encode(["success" => true, "message" => "Your ticket has been sent successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to transmit email. Please try again or email directly."]);
}
?>
