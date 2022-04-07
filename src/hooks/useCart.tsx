import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInStock = await api.get(`stock/${productId}`)

      const productInStockAmount = productInStock.data.amount

      if(productInStockAmount >= 1) {
        const productToAdd = await api.get(`products/${productId}`)

        const productInCart = cart.find(product => product.id === productId)

        const updatedCart = [...cart]

        if(productInCart) {
          updatedCart.map(product => {
            if(product.id === productId) {
              product.amount += 1
            }
            return product
          })

          setCart(updatedCart) 

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
        } else {
          setCart([...cart, {...productToAdd.data, amount: 1}])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...productToAdd.data, amount: 1}]))
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.find(product => product.id === productId)

      if(productToRemove) {
        const updatedCart = cart.filter(product => product.id !== productId)

        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productToUpdate = cart.find(product => product.id === productId)

      if(productToUpdate) {
        if(amount > 0) {
          const productInStock = await api.get(`stock/${productId}`)
          const productInStockAmount = productInStock.data.amount

          if(productInStockAmount >= amount) {
            const updatedCart = cart.map(product => {
              if(product.id === productId) {
                product.amount = amount
              } 
  
              return product
            })
  
            setCart(updatedCart)
  
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

          } else {
            toast.error('Quantidade solicitada fora de estoque');

            return
          }

        } else {
          toast.error('Não é possível alterar a quantidade do produto para 0');
          
          return
        }

      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
