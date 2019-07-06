window.onload = () => {
    console.log('hi');

    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        location.replace('/race');
    } else {
        location.replace('/login');
    }
}