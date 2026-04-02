from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        self.get_queryset().delete()
        return Response({'status': 'All notifications cleared'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def stream(self, request):
        """SSE stream for real-time notifications."""
        # Authenticate via query param for EventSource
        token = request.GET.get('token')
        user = request.user
        if not user.is_authenticated and token:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            try:
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
            except Exception:
                pass
        
        if not user or not user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            
        def sse_stream(user_id):
            import json, time
            from .utils import _get_redis
            r = _get_redis()
            if not r:
                yield f"data: {json.dumps({'error': 'Redis unavailable'})}\n\n"
                return
            
            pubsub = r.pubsub()
            pubsub.subscribe(f'user_notifications:{user_id}')
            yield f"data: {json.dumps({'event_type': 'connected'})}\n\n"
            
            try:
                for message in pubsub.listen():
                    if message['type'] == 'message':
                        try:
                            # Verify message is valid utf-8 json
                            data = message['data'].decode('utf-8')
                            yield f"data: {data}\n\n"
                        except Exception:
                            pass
            except GeneratorExit:
                pass

        from django.http import StreamingHttpResponse
        response = StreamingHttpResponse(sse_stream(user.id), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no' # Disable NGINX buffering
        return response
