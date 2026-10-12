use hotel_booking;
db.createCollection("reviews");
db.createCollection("hotel_feedbacks");
db.reviews.insertMany([
  { hotelId: "H01", userId: "U1", userName: "An", stars: 5, comment: "Rat tot", status: "approved", createdAt: new Date() },
  { hotelId: "H02", userId: "U2", userName: "Binh", stars: 4, comment: "On", status: "approved", createdAt: new Date() }
]);
print("MongoDB seed OK");
