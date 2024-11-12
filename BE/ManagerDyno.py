from debug import g_debug, g_error
from ManagerBase import ManagerBase

from scipy.ndimage import gaussian_filter, laplace
import numpy as np

class ManagerDyno(ManagerBase):

    DEBUG_MODE = True
    VERBOSE_MODE = False

    def __init__(self, client_id) -> None:
        super().__init__(client_id)
        
    def handler_get_dyno_array_resize(self, data:list, size_x:int, size_y:int, max_value:int)->list:
        original = np.array(data)        

        g_debug(f'[Original] Shape = {original.shape} Max = {original.max()} Min = {original.min()}')

        scale_x = int(size_x / len(data[0]))
        scale_y = int(size_y / len(data))

        output_np = np.kron(original, np.ones((scale_y, scale_x)))                
        blurred_np = gaussian_filter(output_np, sigma=3.0)    
        
        blurred_range = {'min': blurred_np.min(), 'max': blurred_np.max()}

        normalized_np = (blurred_np - blurred_range['min']) * max_value / (blurred_range['max'] - blurred_range['min'])

        normalized_np = normalized_np.astype(int)

        g_debug(f'[Blurred] Shape = {normalized_np.shape} Max = {normalized_np.max()} Min = {normalized_np.min()}')

        return normalized_np.tolist()