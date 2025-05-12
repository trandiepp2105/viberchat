import os
import shutil

# Xóa các thư mục __pycache__
for root, dirs, files in os.walk(".", topdown=False):
    for name in dirs:
        if name == "__pycache__":
            shutil.rmtree(os.path.join(root, name))
            print(f"Đã xóa thư mục: {os.path.join(root, name)}")

# Xóa các file trong migrations trừ __init__.py
for root, dirs, files in os.walk(".", topdown=True):
    if "migrations" in root:
        for file in files:
            if file != "__init__.py":
                file_path = os.path.join(root, file)
                os.remove(file_path)
                print(f"Đã xóa file: {file_path}")

print("Hoàn tất xóa thư mục __pycache__ và các file khác trong migrations trừ __init__.py.")
