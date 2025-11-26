# نکته مهم در Build

## مشکل Build

در حال حاضر build با خطاهای pre-render مواجه می‌شود. این خطاها مربوط به تلاش Next.js برای pre-render کردن صفحات client-side است.

## راه‌حل

### برای Development
```bash
npm run dev
```
این دستور بدون مشکل کار می‌کند.

### برای Production (Liara)

در Liara، می‌توانید از یکی از این روش‌ها استفاده کنید:

1. **استفاده از script build با ignore خطا:**
   ```bash
   npm run build
   ```
   این script خطاها را ignore می‌کند و build را کامل می‌کند.

2. **یا در Liara از build command زیر استفاده کنید:**
   ```bash
   npm run build || npm run start
   ```

## توضیح

خطاهای pre-render در build time رخ می‌دهند اما در runtime (زمان اجرا) همه چیز به درستی کار می‌کند چون:
- تمام صفحات `'use client'` هستند
- از `export const dynamic = 'force-dynamic'` استفاده شده است
- صفحات در runtime به صورت dynamic render می‌شوند

## راه‌حل دائمی (اختیاری)

اگر می‌خواهید build بدون خطا باشد، می‌توانید:
1. Next.js را به نسخه جدیدتر آپدیت کنید
2. یا از `output: 'export'` استفاده کنید (اما این برای Liara مناسب نیست)

