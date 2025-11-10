from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# 🔹 If you want to load a real ML model, import joblib and load it here
# import joblib
# model = joblib.load("path_to_your_model.pkl")

def index(request):
    return render(request, "index.html")

@csrf_exempt
def predict(request):
    if request.method == "POST":
        hobby = request.POST.get("hobby", "")
        club = request.POST.get("club", "")
        books = request.POST.get("books", "")

        # 🔹 Dummy prediction logic (replace with model.predict if available)
        hours = 5
        if books == "Yes":
            hours += 2
        if hobby.lower() in ["coding", "programming"]:
            hours += 3
        if club.lower() in ["robotics", "tech"]:
            hours += 2

        return JsonResponse({"prediction": f"Predicted Coding Hours: {hours}"})

    return JsonResponse({"error": "Invalid request"}, status=400)
