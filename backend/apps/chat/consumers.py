from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]

        if not token:
            await self.close(code=4001)
            return

        user = await self._get_user_from_token(token)
        if not user:
            await self.close(code=4003)
            return

        self.user = user
        self.user_group = f"user_{user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def chat_message(self, event):
        await self.send_json({"type": "chat_message", "message": event.get("message", {})})

    @database_sync_to_async
    def _get_user_from_token(self, token):
        try:
            authenticator = JWTAuthentication()
            validated = authenticator.get_validated_token(token)
            return authenticator.get_user(validated)
        except (InvalidToken, TokenError, Exception):
            return None
