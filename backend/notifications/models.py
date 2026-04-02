from django.db import models
from users.models import User

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('RESOURCE', 'Resource'),
        ('QUIZ', 'Quiz'),
        ('FLASHCARD', 'Flashcard Deck'),
        ('REMARK', 'Teacher Remark'),
        ('SYSTEM', 'System Alert'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    # Optional URL to redirect the user when they click the notification
    action_url = models.CharField(max_length=255, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To: {self.user.username} - {self.title}"
