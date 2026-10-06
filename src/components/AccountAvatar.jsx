export default function AccountAvatar({name='',large=false}){
  const initials=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('id-ID');
  return <span className={`account-avatar${large?' large':''}`} aria-hidden="true">{initials||'?'}</span>;
}
