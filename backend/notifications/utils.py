import json
from .models import Notification


def _get_redis():
    """Get Redis connection using Celery broker URL."""
    try:
        import redis as redis_lib
        from django.conf import settings
        broker_url = getattr(settings, 'CELERY_BROKER_URL', None)
        if broker_url:
            return redis_lib.Redis.from_url(broker_url)
    except Exception:
        pass
    return None


def _publish_to_user(user_id, event_data):
    """Publish an SSE event to a specific user's Redis channel."""
    try:
        r = _get_redis()
        if r:
            r.publish(f'user_notifications:{user_id}', json.dumps(event_data, default=str))
    except Exception:
        pass  # Never break main flow if Redis is down


def _serialize_notification(notif):
    return {
        'id': notif.id,
        'user': notif.user_id,
        'title': notif.title,
        'message': notif.message,
        'notification_type': notif.notification_type,
        'action_url': notif.action_url,
        'is_read': notif.is_read,
        'created_at': notif.created_at.isoformat() if notif.created_at else None,
    }


def create_notification(user, title, message, notif_type, action_url=None):
    """Create a notification for a single user and push via SSE."""
    notif = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notif_type,
        action_url=action_url
    )
    _publish_to_user(user.id, {
        'event_type': 'new',
        'notification': _serialize_notification(notif),
    })
    return notif


def notify_students_in_grade(grade, title, message, notif_type, action_url=None):
    """Create notifications for all students in a grade and push via SSE."""
    from users.models import Student
    students = list(Student.objects.filter(grade=grade).select_related('user'))
    notifications = [
        Notification(
            user=student.user, title=title, message=message,
            notification_type=notif_type, action_url=action_url
        ) for student in students
    ]
    created = Notification.objects.bulk_create(notifications)

    for i, notif in enumerate(created):
        _publish_to_user(students[i].user_id, {
            'event_type': 'new',
            'notification': _serialize_notification(notif),
        })


def publish_sse_event(user_id, event_type, data=None):
    """Publish a generic SSE event (for mark-read, clear, etc)."""
    _publish_to_user(user_id, {
        'event_type': event_type,
        **(data or {})
    })
