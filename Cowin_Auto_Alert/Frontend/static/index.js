  
const onSubmitForm=()=>{
 
  const pincode=document.getElementById('pincode').value;
  const email=document.getElementById('email').value;
  const str = pincode
  const regex = new RegExp("^[1-9]{1}[0-9]{2}\\s{0,1}[0-9]{3}$");
  const globalRegex = new RegExp("^[1-9]{1}[0-9]{2}\\s{0,1}[0-9]{3}$", 'g');
  if(regex.test(str)){
    const data = { pincode:pincode,email:email };

    fetch('http://52.25.17.193:80/register', {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => response.json()) 
    .then(data => {
      console.log(data.message);
     //alert(response)
     alert(data.message);
     location.reload();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }else{
    alert("Enter a valid pincode");
  }
  console.log(regex.test(str));

}
