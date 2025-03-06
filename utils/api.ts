import axios from 'axios';

export const ProductsData = async () => {
    try {
        const resp = await axios.get('https://fakestoreapi.com/products');
        // console.log(resp.data)
        return resp.data; /
    } catch (error) {
        console.error('Error fetching products:', error);
        return []; /
    }
};
