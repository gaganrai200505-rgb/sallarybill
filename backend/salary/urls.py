from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.UploadSalaryBillView.as_view()),
    path('bills/', views.MyBillsView.as_view()),
    path('bills/all/', views.AllBillsView.as_view()),
    path('bills/<int:pk>/', views.BillDetailView.as_view()),
    path('bills/<int:pk>/review/', views.ReviewBillView.as_view()),
    path('bills/<int:pk>/recalculate/', views.RecalculateTaxView.as_view()),
    path('bills/<int:bill_pk>/claim/', views.CreateClaimView.as_view()),
    path('claims/', views.MyClaimsView.as_view()),
    path('claims/all/', views.AllClaimsView.as_view()),
    path('claims/<int:pk>/action/', views.ActionClaimView.as_view()),
    path('dashboard/', views.DashboardStatsView.as_view()),
]
