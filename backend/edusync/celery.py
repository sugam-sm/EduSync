import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edusync.settings')
app = Celery('edusync')
app.conf.update(
    broker_connection_retry_on_startup=True,
)
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
