# Supabase setup

1. Supabase project를 만들고 SQL Editor에서 `supabase-schema.sql` 전체를 실행합니다.
2. Authentication > Providers > Email에서 Confirm email을 끕니다. 이 앱은 이메일 대신 ID를 `username@exchange-diary.local` 형식으로 변환합니다.
3. Authentication > Users에서 다음 사용자를 직접 만듭니다.
   - Email: `lamon@exchange-diary.local`
   - Password: `fkahs100409@`
4. 생성된 lamon 사용자의 UUID를 확인한 뒤 SQL Editor에서 실행합니다.

```sql
insert into public.profiles (id, username, is_admin)
values ('LAMON_AUTH_USER_UUID', 'lamon', true)
on conflict (id) do update set username = 'lamon', is_admin = true;
```

5. Project Settings > API의 Project URL과 anon public key를 `supabase-config.js`에 입력합니다.
6. `index.html`을 다시 열면 모든 기기에서 같은 계정과 일기를 사용합니다.

`service_role` 키는 브라우저 코드에 넣지 않습니다.
