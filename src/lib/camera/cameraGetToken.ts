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
      let errorMessage = `EZVIZ แจ้งว่า: ${data.msg}`;

      switch (data.code) {
        case "10001":
          errorMessage =
            "พารามิเตอร์ไม่ถูกต้อง (ตรวจสอบ AppKey/Secret ใน .env)";
          break;
        case "10005":
          errorMessage = "AppKey นี้ถูกระงับการใช้งาน (Frozen)";
          break;
        case "10017":
          errorMessage = "ไม่มี AppKey นี้ในระบบ (AppKey ไม่ถูกต้อง)";
          break;
        case "10030":
          errorMessage = "AppKey และ AppSecret ไม่ตรงกัน";
          break;
        case "49999":
          errorMessage = "ระบบเชื่อมต่อ API ของ EZVIZ ขัดข้องชั่วคราว";
          break;
      }

      console.error(`❌ EZVIZ API Error [${data.code}]:`, data.msg);
      return { success: false, error: errorMessage };
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
