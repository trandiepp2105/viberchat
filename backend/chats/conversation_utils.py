from django.contrib.auth import get_user_model
from .models_conversation import Conversation

User = get_user_model()

def get_or_create_direct_conversation(user1, user2):
    """
    Lấy hoặc tạo mới cuộc trò chuyện trực tiếp giữa hai người dùng.
    Đảm bảo rằng hai người dùng chỉ có một cuộc trò chuyện chung.
    """
    # Sắp xếp ID để đảm bảo tính nhất quán
    participant_ids = sorted([str(user1.id), str(user2.id)])
    participant_key = '-'.join(participant_ids)
    
    # Tìm cuộc trò chuyện hiện có hoặc tạo mới
    try:
        conversation = Conversation.objects.get(
            is_direct=True,
            direct_participants=participant_key
        )
        created = False
    except Conversation.DoesNotExist:
        conversation = Conversation.objects.create(
            name='',  # Không cần tên cho chat 1-1
            is_group=False,
            is_direct=True,
            direct_participants=participant_key
        )
        # Đảm bảo cả hai người dùng là thành viên
        conversation.participants.add(user1, user2)
        created = True
    
    return conversation, created

def create_group_conversation(creator, name, participant_ids):
    """
    Tạo một cuộc trò chuyện nhóm mới với tên và danh sách thành viên.
    """
    # Tạo nhóm chat mới
    conversation = Conversation.objects.create(
        name=name,
        is_group=True,
        is_direct=False,
        direct_participants=''  # Trống cho nhóm chat
    )
    
    # Thêm người tạo
    conversation.participants.add(creator)
    
    # Thêm các thành viên khác
    for user_id in participant_ids:
        try:
            user = User.objects.get(id=user_id)
            if user.id != creator.id:  # Tránh thêm người tạo 2 lần
                conversation.participants.add(user)
        except User.DoesNotExist:
            pass
    
    return conversation
