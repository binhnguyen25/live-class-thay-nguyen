# 🏫 LIVE-CLASS — Thầy Nguyên

**Lớp học tương tác TikTok LIVE (khổ dọc 1080×1920) — với Thầy Nguyên**

Nơi người xem hóa thân thành học sinh ngồi bàn, giơ tay chinh phục 12 chủ đề kiến thức
(Toán nhẩm, Tiếng Anh, Lịch sử, Địa lý, Khoa học, Văn học, Ca dao tục ngữ, Đuổi hình Emoji,
Đố mẹo, Ẩm thực, Thể thao, Đố vui tổng hợp — **180 câu hỏi**), tích lũy Học Bạ từ Lớp 1 đến
Tốt Nghiệp Tú Tài 🎓 cùng Thầy Nguyên!

🌐 **Chạy thử ngay:** https://binhnguyen25.github.io/live-class-thay-nguyen/

## ✨ Có gì trong lớp học Thầy Nguyên

| Tính năng | Chi tiết |
|---|---|
| 🎮 Buổi học 20 câu | 4 kỳ: 🌱 Kỳ 1 Khởi động (câu 1–5) → ⚡ Kỳ 2 Tăng tốc (6–10) → 🔥 Kỳ 3 Bứt phá (11–15) → 👑 Kỳ 4 Tú Tài (16–20) |
| ✍️ Chấm điểm tay | Ghi tên bạn trả lời đúng theo thứ tự. Hạng 1 +10đ, hạng 2 +7đ, hạng 3 +5đ, hạng 4–5 +3đ, từ hạng 6 +1đ. Câu vàng (5, 10, 15, 20) nhân đôi. Streak ≥ 3 cộng thêm 🔥 |
| 🪑 30 ghế lớp học | 30 chỗ ngồi hiển thị trực tiếp trên sân khấu; bạn mới tích cực được nhường ghế bạn im lâu nhất |
| 🎙️ Giọng đọc Thầy Nguyên | Đọc câu hỏi & lời khen bằng giọng Việt của máy (Speech Synthesis, miễn phí, không API) |
| 🧪 Bộ giả lập khán giả | 👋 Người vào · 💬 Comment đáp án · ➕ Follow (+5đ) · ❤️ 100 tim · 🌹 Quà · 👑 Quà lớn (phong Lớp trưởng VIP) |
| 🏔️ Đường lên đỉnh Everest | 4 chặng (+10 / +20 / +30 / +50đ) |
| 🔔 Rung chuông đồng | 5 câu sinh tồn, ai cao điểm nhất rung chuông nhận Quán quân |
| 🎉 Giờ ra chơi | 5 mini-game ngẫu nhiên: Oẳn tù tì, Kiểm tra miệng, Chọn phe A/B, Điểm danh, Nhảy múa thả tim |
| 🎓 Học bạ trọn đời | Điểm tích lũy lưu trên máy thầy, thăng cấp Lớp 1 → Lớp 12 → Tốt nghiệp |
| 🌹 Quỹ hoa của lớp | Quà tặng cộng vào quỹ hoa chung của lớp |
| 👋 Tan trường | Lễ tổng kết, bục vinh danh Top 3, kêu gọi follow kênh |
| ⚔️ Tổ đua tài | 4 tổ Sư Tử / Đại Bàng / Cá Heo / Gấu Trúc đua điểm |

## 🚀 Cách dùng khi live thật

1. Mở trang web trên máy tính, bấm **Bắt đầu buổi học**.
2. Mở link stage riêng (nút **Mở stage tab mới**, dạng `?view=stage`).
3. Trong **TikTok LIVE Studio / OBS**: Add Source → Browser, dán link stage,
   đặt kích thước **1080 × 1920**.
4. Khi khán giả comment đáp án, thầy gõ tên vào ô **Chấm điểm tay** theo thứ tự
   trả lời đúng, rồi bấm **Lật đáp án & chấm điểm**.
5. Kết thúc bấm **👋 Tan trường** — điểm tự cộng dồn vào học bạ.

## ⚠️ Lưu ý quan trọng

Bản web này chạy hoàn toàn trên trình duyệt (GitHub Pages) nên **không kết nối
trực tiếp vào TikTok LIVE** để đọc bình luận tự động — TikTok không cho web tĩnh
làm việc đó. Vì vậy lớp học dùng **bộ giả lập bình luận + chấm điểm tay** như trên.
Muốn đọc comment live tự động thì cần chạy bản máy chủ Node + TikTok Live Connector
như bản gốc (xem mục Nguồn cảm hứng).

## 📖 Nguồn cảm hứng

Làm theo cảm hứng từ repo **LIVE-CLASS** (MIT) của Duong Birken
(https://github.com/duongbirken2510/LIVE-CLASS) — game show lớp học tương tác
TikTok LIVE với Cô Ngân & Thầy Minh, 34 chủ đề, 2.500+ câu hỏi, giọng VieNeu-TTS,
chạy bằng React + Node + TikTok Live Connector.

**Bản Thầy Nguyên viết lại hoàn toàn từ đầu** cho GitHub Pages: không dùng code hay
ảnh gốc, chỉ giữ lại ý tưởng & luật chơi (20 câu / 4 kỳ / câu vàng ×2 / 30 ghế /
Everest / Chuông đồng / giờ ra chơi / học bạ / tan trường), đổi giáo viên thành
**Thầy Nguyên**, ngân hàng câu hỏi tự soạn (180 câu), giọng đọc dùng giọng Việt
miễn phí của trình duyệt.

## 📂 Cấu trúc

```
live-class-thay-nguyen/
├── index.html   # Toàn bộ app: dashboard + sân khấu 1080×1920 + 180 câu hỏi
├── README.md
└── .nojekyll
```

Mở `index.html` là chạy — không cần cài đặt gì thêm.
