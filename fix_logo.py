import os

files = {
    'login.vue': 'src/pages/auth/login.vue',
    'register.vue': 'src/pages/auth/register.vue',
    'forgot-password.vue': 'src/pages/auth/forgot-password.vue',
}

for fname, path in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Change mode="widthFix" to mode="aspectFit"
    content = content.replace('mode="widthFix"', 'mode="aspectFit"')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'{fname}: mode changed to aspectFit')

print('All done')
