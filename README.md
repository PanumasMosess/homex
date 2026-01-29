🚀 Getting Started (เริ่มต้นใช้งาน)

Clone a Repository
git clone https://github.com/PanumasMosess/homex.git
cd posxAI
ติดตั้ง Dependencies
npm install
ตั้งค่า Environment Variables
DATABASE_URL="mysql://root:@localhost:3306/homex"
NODE_ENV="development"
S3_BUCKET = 'homex'
NEXT_PUBLIC_S3_BUCKET_NAME = 'S3_NAME'
SECRET_KEY = 'S3_SECRET_KEY'
KEY = 'S3_KEY'
ENDPOINT = 'S3_ENDPOINT'
REGION = 'S3_REGION'
CDN_IMG = 'S3_CDN_IMG'
GOOGLE_CLOUD_API_KEY='GOOGLE_CLOUD_API_KEY'
OPENAI_API_KEY='OPENAI_API_KEY' (if your use open AI)
DEEPSEEK_API_KEY='DEEPSEEK_API_KEY'
GEMINI_API_KEY='GEMINI_API_KEY'
GEMINI_MODEL='gemini-2.5-flash' (model gemini)
Migrate ฐานข้อมูล
npx prisma migrate dev
(Optional) Seed ข้อมูลเริ่มต้น
npx prisma db seed
📜 Available Scripts (คำสั่งที่ใช้งานได้)

npm run dev: รันแอปพลิเคชันในโหมดพัฒนา
npm run build: สร้าง Production Build
npm start: รัน Production Server
npx prisma migrate dev: อัปเดต Schema ของฐานข้อมูล
