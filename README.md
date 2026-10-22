# BOSI Tekin Robux Platformasi & Telegram Bot

Ushbu loyiha **BOSI Tekin Robux** tap-to-earn o'yini, Roblox yutuqlarini chiqarish tizimi va **@BOSI_tekin_robuxbot** Telegram boti integratsiyasini o'z ichiga oladi.

## 🚀 O'rnatish va Ishga Tushirish Yo'riqnomasi

### 1. Talablar:
- Node.js (v18 yoki undan yuqori)
- npm yoki yarn

### 2. O'rnatish:
```bash
npm install
```

### 3. Telegram Bot Sozlamalari:
`.env` faylini oching yoki yarating:
```env
TELEGRAM_BOT_TOKEN="8820946196:AAH2qMY2Vs3kqo0M_2LBCPrizzgd_QsTR7M"
ADMIN_USERNAMES="bosi_admin,vip_bosi,fastabbos,fastabbosrbx"
APP_URL="https://sizning-saytingiz-domen.uz"
```

### 4. Loyihani Ishga Tushirish:
```bash
# Rivojlanish (Development) rejimi:
npm run dev

# Ishlab chiqarish (Production) uchun qurish:
npm run build
npm start
```
Server avtomatik ravishda `http://localhost:3000` portida ishga tushadi va Telegram bot 24/7 rejimida yangiliklarni qabul qiladi.

---

## 💎 Asosiy Funksiyalar

1. **Tap-to-Earn (Robux Qazish)**:
   - Katta 3D Robux tangasi bosilganda 0.10 RBX beradi.
   - Do'kondan (Shop) 100 RBX ga sotib olinsa, 2 barobar ko'payib 0.20 RBX beradi (har daraja 2x ko'payadi).
   - Web Audio API asosidagi real vaqtli metall tanga, yutuq va upgrade tovush effektlari.

2. **Roblox Akkauntini Bog'lash**:
   - Hech qanday parol talab qilinmaydi (100% xavfsiz).
   - Roblox.com orqali o'yinchi avatari qidiriladi va "Shumi?" tasdig'i olinadi.
   - Nik biriktirilib, boshqa odamlar uni qayta ishlata olmaydi.

3. **Robux Yechish (Chiqarish)**:
   - Minimal: 1,000 Robux (1k RBX).
   - Maksimal: 100,000,000 Robux (100m RBX).
   - Yetkazib berish muddati: Taxminan 20 kunda hisobga tushadi.

4. **Mini-O'yinlar**:
   - Omad charxi (Wheel of fortune)
   - Sirli qutilar (Mystery chests)
   - Tanga tashlash (Coin flip)

5. **Yakshanba 20:00 Konkursi**:
   - Har yakshanba soat 20:00 da 3 ta o'yinchiga 10,000 RBX dan (jami 30,000 RBX) avtomatik taqsimlanadi.

6. **Admin Panel**:
   - Ruxsat: `@bosi_admin`, `@vip_bosi`, `@fastabbos`, `@fastabbosrbx`
   - Parol: `BOSI2010`
   - Majburiy kanallarni boshqarish, arizalarni tasdiqlash, ommaviy xabarnoma yuborish.
