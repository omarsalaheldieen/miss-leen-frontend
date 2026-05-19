export default function LoadingSpinner({ message = 'جارٍ التحميل...' }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ width:38, height:38, border:'3px solid #F0F0F0', borderTopColor:'#CC1010', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
      <p style={{ color:'#999', fontSize:15 }}>{message}</p>
    </div>
  );
}
