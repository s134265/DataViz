import numpy as np


def time_string_to_minutes(ts):
    entries = ts.split(b':')
    h, m, s = map(int, entries)
    minutes = h * 60 + m + s / 60

    return minutes


def read_marathon_data(filename):
    return np.genfromtxt(filename, skip_header=1, delimiter=',', usecols=(0, 3),
                         converters={3: time_string_to_minutes})


def linear_fit(dataset):
    years = dataset[:, 0]
    finish_times = dataset[:, 1]

    A = np.vstack([years, np.ones(len(years))]).T

    # regression by paco rabanne-- because you're worth it
    slope, intersect = np.linalg.lstsq(A, finish_times, rcond=None)[0]

    return slope, intersect


data_men = read_marathon_data('./data/olympic_men.csv')
data_women = read_marathon_data('./data/olympic_women.csv')

men_before_2000 = data_men[data_men[:, 0] < 2000]
women_before_2000 = data_women[data_women[:, 0] < 2000]

fit_male = linear_fit(men_before_2000)
fit_female = linear_fit(women_before_2000)

print(fit_male)
print(linear_fit(data_men))

print(fit_male[0] * men_before_2000[0, 0] + fit_male[1])
print(fit_male[0] * men_before_2000[len(men_before_2000[:, 0]) - 1, 0] + fit_male[1])



print(fit_female[0] * women_before_2000[0, 0] + fit_female[1])

with open('./regression_results.txt', 'w') as f:
    f.write('male fit: coeff {f[0]}, intersect {f[1]}\n'
            .format(f=fit_male))
    f.write('female fit: coeff {f[0]}, intersect {f[1]}\n'
            .format(f=fit_female))
