import { http } from '@/lib/http';
import httplogin from '@/lib/ky';
import { checkUserAuthenticated } from '@/utils/auth.utils';

export type LoginRequest = {
  email: string;
  password: string;
};
export type AuthUser = {
  userId: string;
  orgId: string;
  role: string;
};
export type LoginResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

// Persist tokens (basic localStorage; replace with secure storage if needed)
function persistTokens(
  accessToken: string,
  refreshToken: string,
) {
  try {
    localStorage.setItem(
      'access_token',
      accessToken,
    );
    localStorage.setItem(
      'refresh_token',
      refreshToken,
    );
  } catch (e) {
    // storage not available (SSR or disabled)
  }
}

export async function login(dto: LoginRequest) {
  try {
    const res = await httplogin.post(
      'auth/login',
      {
        json: dto,
      },
    );
    //   const data = (await res.json()) as LoginResponse;
    //   console.log('res', res);

    const result = await res.json();
    const data = result as LoginResponse;

    const { user, access_token, refresh_token } =
      data;

    // Save tokens for subsequent requests
    persistTokens(access_token, refresh_token);

    return {
      success: true,
      user,
      access_token,
      refresh_token,
    };
  } catch (error) {
    console.log('error', error);
    const isUnauthorized =
      error instanceof Error &&
      (error as any).response?.status === 401;

    return {
      success: false,
      message: isUnauthorized
        ? 'Invalid email or password'
        : 'An error occurred while logging in',
    };
  }
  // Save tokens for subsequent requests
  //   persistTokens(data.access_token, data.refresh_token);

  //   return data;
}

// export async function login(dto: LoginRequest) {
//   try {
//     const result = await http.post('auth/login', {
//       json: dto,
//       timeout: 30000,
//     });
//     //   const data = (await result.json()) as LoginResponse;

//     const { user, access_token, refresh_token } =
//       (await result.json()) as LoginResponse;

//     // Save tokens for subsequent requests
//     persistTokens(access_token, refresh_token);

//     return {
//       success: true,
//       user,
//       access_token,
//       refresh_token,
//     };
//   } catch (error) {
//     console.error(error);
//     const isUnauthorized =
//       error instanceof HTTPError &&
//       error.response?.status === 401;

//     return {
//       success: false,
//       message: isUnauthorized
//         ? 'Invalid email or password'
//         : 'An error occurred while logging in',
//     };
//   }
// }

export async function logout() {}

export async function getNewAccessToken(
  refresh_token: string,
) {
  try {
    const res = await http.post(
      'auth/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      },
    );
    const data = (await res) as {
      access_token: string;
    };
    const { access_token } = data;

    // Update stored access token
    // persistTokens(access_token, refresh_token);
    return access_token;
  } catch (error) {
    throw new Error(
      'An error occurred while refreshing token',
    );
  }
}

export async function refreshToken() {
  const refresh_token = localStorage.getItem(
    'refresh_token',
  );

  if (!refresh_token) {
    return {
      success: false,
      message: 'No refresh token available',
    };
  }
  try {
    const res = await http.post(
      'auth/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      },
    );
    const data = (await res) as {
      access_token: string;
    };
    const { access_token } = data;

    // Update stored access token
    persistTokens(access_token, refresh_token);
  } catch (error) {
    console.log('error', error);
    throw new Error(
      'An error occurred while refreshing token',
    );
  }
}

// get user info

export async function fetchUserDetails() {
  //   const isAuthenticated =
  //     await checkUserAuthenticated();
  //   if (!isAuthenticated) {
  //     // this is meant to force the caller to handle unauthenticated state to redirect to login
  //     throw new Error('User is not authenticated');
  //   }

  //   const access_token = localStorage.getItem(
  //     'access_token',
  //   );

  try {
    const res = await http.get(
      'auth/profile',
      {},
    );
    const data = (await res) as AuthUser;
    return data;
  } catch (error) {
    console.log('error', error);
    throw new Error(
      'An error occurred while fetching user details',
    );
  }
}
