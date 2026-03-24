"use server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function getCameraCredentials(
  deviceSerial: string,
  channelNo: string = "1",
) {
  try {
    const res = await fetch("https://open.ezvizlife.com/api/lapp/token/get", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        appKey: process.env.CAMERA_APP_KEY || "", 
        appSecret: process.env.CAMERA_SECRET_KEY || "", 
      }),
      cache: "no-store",
    });

    const rawText = await res.text();

    if (rawText.trim().startsWith("<")) {
      console.error("❌ ได้รับ HTML Error:", rawText.substring(0, 200));
      return { success: false, error: "Server EZVIZ ปฏิเสธการเชื่อมต่อ" };
    }

    const data = JSON.parse(rawText);

    if (data.code !== "200") {
      console.error("❌ EZVIZ API Error:", data.msg);
      return { success: false, error: `EZVIZ แจ้งว่า: ${data.msg}` };
    }

    const accessToken = data.data.accessToken;
    const areaDomain = data.data.areaDomain; 

    const ezopenUrl = `ezopen://open.ezviz.com/${deviceSerial}/${channelNo}.live`;

    return {
      success: true,
      accessToken,
      ezopenUrl,
      areaDomain,
    };
  } catch (error) {
    console.error("Action Error:", error);
    return {
      success: false,
      error: "ดึงข้อมูลล้มเหลว ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    };
  }
}
